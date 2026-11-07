(*---
description: Function Literal. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/functions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE functions_function_literal ----
op == [n \in Nat |-> 2*n]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 9, col 14 to line 9, col 16 of module functions_function_literal
    | Unknown operator: `Nat'.
    | line 9, col 23 to line 9, col 23 of module functions_function_literal
    | Could not find declaration or definition of symbol '*'.
    | line 9, col 22 to line 9, col 24 of module functions_function_literal
    | Couldn't resolve infix operator symbol `*'.
    3002:1 Parsing or semantic analysis failed.
---*)
