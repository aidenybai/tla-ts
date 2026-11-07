(*---
description: Function Literal with Multiple Parameters and Jlist. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/functions-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE functions_unicode_function_literal_with_multiple_parameters_and_jlist ----
op ≜ [
  x, y ∈ ℕ, ⟨a, b⟩ \in
    ∧ A
    ∧ B
      ↦
        ∧ A
        ∧ B
            ]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 5
    | line 10, col 10 to line 10, col 10 of module functions_unicode_function_literal_with_multiple_parameters_and_jlist
    | Unknown operator: `ℕ'.
    | line 11, col 7 to line 11, col 7 of module functions_unicode_function_literal_with_multiple_parameters_and_jlist
    | Unknown operator: `A'.
    | line 12, col 7 to line 12, col 7 of module functions_unicode_function_literal_with_multiple_parameters_and_jlist
    | Unknown operator: `B'.
    | line 14, col 11 to line 14, col 11 of module functions_unicode_function_literal_with_multiple_parameters_and_jlist
    | Unknown operator: `A'.
    | line 15, col 11 to line 15, col 11 of module functions_unicode_function_literal_with_multiple_parameters_and_jlist
    | Unknown operator: `B'.
    3002:1 Parsing or semantic analysis failed.
---*)
