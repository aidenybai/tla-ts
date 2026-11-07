(*---
description: Function Definition. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/functions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE functions_function_definition ----
f[x \in Nat] == x
f[x, y \in Nat] == x
f[x, y \in Nat, z \in Real] == x
f[x \in [Nat -> (Nat)]] == x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 9
    | line 9, col 9 to line 9, col 11 of module functions_function_definition
    | Unknown operator: `Nat'.
    | line 10, col 12 to line 10, col 14 of module functions_function_definition
    | Unknown operator: `Nat'.
    | line 10, col 1 to line 10, col 20 of module functions_function_definition
    | Function name `f' already defined or declared.
    | line 11, col 12 to line 11, col 14 of module functions_function_definition
    | Unknown operator: `Nat'.
    | line 11, col 23 to line 11, col 26 of module functions_function_definition
    | Unknown operator: `Real'.
    | line 11, col 1 to line 11, col 32 of module functions_function_definition
    | Function name `f' already defined or declared.
    | line 12, col 10 to line 12, col 12 of module functions_function_definition
    | Unknown operator: `Nat'.
    | line 12, col 18 to line 12, col 20 of module functions_function_definition
    | Unknown operator: `Nat'.
    | line 12, col 1 to line 12, col 28 of module functions_function_definition
    | Function name `f' already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
