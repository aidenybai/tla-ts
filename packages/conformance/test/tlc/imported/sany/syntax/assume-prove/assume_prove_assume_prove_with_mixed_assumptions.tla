(*---
description: Assume/Prove with Mixed Assumptions. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/assume-prove.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE assume_prove_assume_prove_with_mixed_assumptions ----
THEOREM thm ==
  ASSUME
    NEW f,
    1 + 2,
    /\ 1
    /\ 2,
    lbl :: ASSUME P PROVE Q
  PROVE C
OMITTED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 5
    | line 12, col 7 to line 12, col 7 of module assume_prove_assume_prove_with_mixed_assumptions
    | Could not find declaration or definition of symbol '+'.
    | line 12, col 5 to line 12, col 9 of module assume_prove_assume_prove_with_mixed_assumptions
    | Couldn't resolve infix operator symbol `+'.
    | line 15, col 19 to line 15, col 19 of module assume_prove_assume_prove_with_mixed_assumptions
    | Unknown operator: `P'.
    | line 15, col 27 to line 15, col 27 of module assume_prove_assume_prove_with_mixed_assumptions
    | Unknown operator: `Q'.
    | line 16, col 9 to line 16, col 9 of module assume_prove_assume_prove_with_mixed_assumptions
    | Unknown operator: `C'.
    3002:1 Parsing or semantic analysis failed.
---*)
