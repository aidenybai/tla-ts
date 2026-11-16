(*---
description: Basic Assume/Prove. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/assume-prove.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE assume_prove_basic_assume_prove ----
THEOREM thm ==
  ASSUME P, Q
  PROVE C
OBVIOUS
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 10, col 10 to line 10, col 10 of module assume_prove_basic_assume_prove
    | Unknown operator: `P'.
    | line 10, col 13 to line 10, col 13 of module assume_prove_basic_assume_prove
    | Unknown operator: `Q'.
    | line 11, col 9 to line 11, col 9 of module assume_prove_basic_assume_prove
    | Unknown operator: `C'.
    3002:1 Parsing or semantic analysis failed.
---*)
