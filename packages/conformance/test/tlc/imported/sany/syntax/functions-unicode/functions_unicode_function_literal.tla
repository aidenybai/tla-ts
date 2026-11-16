(*---
description: Function Literal. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/functions-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE functions_unicode_function_literal ----
op ≜ [n ∈ ℕ ↦ 2*n]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 9, col 11 to line 9, col 11 of module functions_unicode_function_literal
    | Unknown operator: `ℕ'.
    | line 9, col 16 to line 9, col 16 of module functions_unicode_function_literal
    | Could not find declaration or definition of symbol '*'.
    | line 9, col 15 to line 9, col 17 of module functions_unicode_function_literal
    | Couldn't resolve infix operator symbol `*'.
    3002:1 Parsing or semantic analysis failed.
---*)
