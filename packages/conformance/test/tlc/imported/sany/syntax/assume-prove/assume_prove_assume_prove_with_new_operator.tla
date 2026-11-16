(*---
description: Assume/Prove With New Operator. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/assume-prove.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE assume_prove_assume_prove_with_new_operator ----
THEOREM thm ==
  ASSUME NEW TEMPORAL f(_, _)
  PROVE C
OMITTED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 9 to line 11, col 9 of module assume_prove_assume_prove_with_new_operator
    | Unknown operator: `C'.
    3002:1 Parsing or semantic analysis failed.
---*)
