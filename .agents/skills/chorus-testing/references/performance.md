# Performance

- Measure performance only when the change targets performance or there is a concrete regression concern; routine cleanup requires correctness checks, and changes only to helper calls, imports, or data representation do not require separate synthetic benchmarks.
- When measuring, use representative complete tasks and compare equivalent before/after flows when possible.
- Report elapsed time, CPU time, and peak memory for the entire process family as applicable, plus token usage for model calls; distinguish cold and warm runs and label estimates and unmeasured costs.
- Fewer bytes alone do not prove fewer tokens or faster analysis.
- When reporting measured speedups, regressions, or evaluation differences, explain which limiting factors changed and variation across runs; do not treat differences smaller than run-to-run variation as meaningful.
