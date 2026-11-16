(*---
description: Function Definition. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/functions-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE functions_unicode_function_definition ----
f[x ∈ ℕ] ≜ x
f[x, y ∈ ℕ] ≜ x
f[x, y ∈ ℕ, z ∈ ℝ] ≜ x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 6
    | line 9, col 7 to line 9, col 7 of module functions_unicode_function_definition
    | Unknown operator: `ℕ'.
    | line 10, col 10 to line 10, col 10 of module functions_unicode_function_definition
    | Unknown operator: `ℕ'.
    | line 10, col 1 to line 10, col 15 of module functions_unicode_function_definition
    | Function name `f' already defined or declared.
    | line 11, col 10 to line 11, col 10 of module functions_unicode_function_definition
    | Unknown operator: `ℕ'.
    | line 11, col 17 to line 11, col 17 of module functions_unicode_function_definition
    | Unknown operator: `ℝ'.
    | line 11, col 1 to line 11, col 22 of module functions_unicode_function_definition
    | Function name `f' already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
