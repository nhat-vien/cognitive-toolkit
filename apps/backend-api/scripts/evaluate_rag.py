"""
Standalone Grounded Clinical RAG Benchmark & Abstention Evaluator (`apps/backend-api/scripts/evaluate_rag.py`).

Usage:
    python apps/backend-api/scripts/evaluate_rag.py --top-k 3 --threshold 0.46

Loads `packages/clinical-protocols-kb/evals/rag_retrieval.json` (30 versioned cases:
20 in-scope positive clinical retrieval cases + 10 out-of-scope negative cases),
runs `GroundedClinicalRAG`, prints a formatted Markdown table of `Recall@K`, `MRR`,
and `Abstention Accuracy`, and exits with code `0` only if `Recall@K >= 0.85`
and `Abstention Accuracy == 1.0`.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

# Ensure `apps/backend-api` is on sys.path so `src.*` imports resolve cleanly
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = SCRIPT_DIR.parent
REPO_ROOT = BACKEND_ROOT.parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from src.config import RAG_SCORE_THRESHOLD
from src.rag.grounded_rag import GroundedClinicalRAG


def default_eval_file() -> Path:
    return REPO_ROOT / "packages" / "clinical-protocols-kb" / "evals" / "rag_retrieval.json"


def evaluate_benchmark(
    eval_path: Path,
    top_k: int = 3,
    threshold: float = RAG_SCORE_THRESHOLD,
) -> Dict[str, Any]:
    if not eval_path.exists():
        raise FileNotFoundError(f"Evaluation benchmark file not found: {eval_path}")

    benchmark = json.loads(eval_path.read_text(encoding="utf-8"))
    test_cases: List[Dict[str, Any]] = benchmark.get("test_cases", [])

    rag = GroundedClinicalRAG(threshold=threshold)

    positive_cases = [tc for tc in test_cases if not tc.get("should_abstain", False)]
    negative_cases = [tc for tc in test_cases if tc.get("should_abstain", False)]

    hits_at_k = 0
    reciprocal_ranks: List[float] = []
    abstained_correct = 0
    case_rows: List[Dict[str, Any]] = []

    for tc in test_cases:
        tc_id = tc["id"]
        query = tc["query"]
        should_abstain = bool(tc.get("should_abstain", False))
        expected_protocols = set(tc.get("expected_protocols", []))

        res = rag.search(query=query, top_k=top_k)
        abstained = bool(res["abstained"])
        top_score = float(res["top_score"])
        retrieved_protocols = [r["technique"] for r in res["results"][:top_k]]

        if should_abstain:
            passed = abstained and top_score < threshold and len(res["citations"]) == 0
            if passed:
                abstained_correct += 1
            rank_str = "ABSTAIN" if abstained else "FALSE_POS"
        else:
            rank = 0
            for idx, proto in enumerate(retrieved_protocols, start=1):
                if proto in expected_protocols:
                    rank = idx
                    break
            passed = (not abstained) and (rank > 0) and (top_score >= threshold)
            if passed:
                hits_at_k += 1
                reciprocal_ranks.append(1.0 / rank)
            else:
                reciprocal_ranks.append(0.0)
            rank_str = f"#{rank}" if rank > 0 else "MISS"

        case_rows.append(
            {
                "id": tc_id,
                "lang": tc.get("language", "vi"),
                "should_abstain": should_abstain,
                "abstained": abstained,
                "top_score": top_score,
                "expected_protocols": list(expected_protocols),
                "retrieved_protocols": retrieved_protocols,
                "rank": rank_str,
                "passed": passed,
            }
        )

    recall_at_k = hits_at_k / max(1, len(positive_cases))
    mrr = sum(reciprocal_ranks) / max(1, len(positive_cases))
    abstention_accuracy = abstained_correct / max(1, len(negative_cases))

    return {
        "version": benchmark.get("version", "1.0.0"),
        "top_k": top_k,
        "threshold": threshold,
        "total_cases": len(test_cases),
        "positive_cases": len(positive_cases),
        "negative_cases": len(negative_cases),
        "hits_at_k": hits_at_k,
        "recall_at_k": round(recall_at_k, 4),
        "mrr": round(mrr, 4),
        "abstained_correct": abstained_correct,
        "abstention_accuracy": round(abstention_accuracy, 4),
        "cases": case_rows,
        "gate_passed": (recall_at_k >= 0.85) and (abstention_accuracy == 1.0),
    }


def print_markdown_report(summary: Dict[str, Any]) -> None:
    top_k = summary["top_k"]
    threshold = summary["threshold"]
    recall = summary["recall_at_k"]
    mrr = summary["mrr"]
    abstention = summary["abstention_accuracy"]

    print(f"# Equilibria Grounded Clinical RAG Evaluation Report (v{summary['version']})")
    print(f"- **Threshold (`RAG_SCORE_THRESHOLD`)**: `{threshold:.2f}`")
    print(f"- **Top-K**: `{top_k}`")
    print(
        f"- **Dataset**: `{summary['total_cases']}` cases "
        f"(`{summary['positive_cases']}` positive in-scope + `{summary['negative_cases']}` negative out-of-scope)\n"
    )

    print("## 1. Aggregate Benchmark Metrics\n")
    print("| Metric | Score | Target Gate | Status |")
    print("| :--- | :---: | :---: | :---: |")
    print(
        f"| `Recall@{top_k}` | **{recall * 100:.1f}%** ({summary['hits_at_k']}/{summary['positive_cases']}) "
        f"| `>= 85.0%` | {'PASS' if recall >= 0.85 else 'FAIL'} |"
    )
    print(
        f"| `MRR` (Mean Reciprocal Rank) | **{mrr:.4f}** | `>= 0.8000` | {'PASS' if mrr >= 0.80 else 'WARN'} |"
    )
    print(
        f"| `Abstention Accuracy` | **{abstention * 100:.1f}%** ({summary['abstained_correct']}/{summary['negative_cases']}) "
        f"| `== 100.0%` | {'PASS' if abstention == 1.0 else 'FAIL'} |"
    )
    print()

    print("## 2. Per-Case Retrieval & Abstention Breakdown\n")
    print("| Case ID | Lang | Expected | Top-K Retrieved | Top Score | Rank / Outcome | Result |")
    print("| :--- | :---: | :--- | :--- | :---: | :---: | :---: |")
    for row in summary["cases"]:
        expected_str = ", ".join(row["expected_protocols"]) if not row["should_abstain"] else "<ABSTAIN>"
        retrieved_str = ", ".join(row["retrieved_protocols"]) if row["retrieved_protocols"] else "[]"
        status_str = "PASS" if row["passed"] else "FAIL"
        print(
            f"| `{row['id']}` | `{row['lang']}` | `{expected_str}` | `{retrieved_str}` "
            f"| `{row['top_score']:.4f}` | `{row['rank']}` | **{status_str}** |"
        )
    print()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Evaluate GroundedClinicalRAG Recall@K, MRR, and Abstention Accuracy."
    )
    parser.add_argument("--top-k", type=int, default=3, help="Top-K chunks to retrieve (default: 3)")
    parser.add_argument(
        "--threshold",
        type=float,
        default=RAG_SCORE_THRESHOLD,
        help="Strict RAG abstention cosine score threshold (default: 0.46)",
    )
    parser.add_argument(
        "--eval-file",
        type=str,
        default=str(default_eval_file()),
        help="Path to rag_retrieval.json benchmark file",
    )
    args = parser.parse_args()

    summary = evaluate_benchmark(
        eval_path=Path(args.eval_file),
        top_k=args.top_k,
        threshold=args.threshold,
    )
    print_markdown_report(summary)
    return 0 if summary["gate_passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
