(*---
description: Jlist Inside Unicode Function Evaluation. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/functions-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE functions_unicode_jlist_inside_unicode_function_evaluation ----
op ≜
    ∧ 1
    ∧ f[
        ∨ 2
        ∨ 3,
        ∧ 4
          ]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 7 of module functions_unicode_jlist_inside_unicode_function_evaluation
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)
