(*---
description: Assume/Prove With New Constant. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/assume-prove.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE assume_prove_assume_prove_with_new_constant ----
THEOREM thm ==
  ASSUME NEW CONSTANT x \in S
  PROVE C
OBVIOUS
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 29 to line 10, col 29 of module assume_prove_assume_prove_with_new_constant
    | Unknown operator: `S'.
    | line 11, col 9 to line 11, col 9 of module assume_prove_assume_prove_with_new_constant
    | Unknown operator: `C'.
    3002:1 Parsing or semantic analysis failed.
---*)
