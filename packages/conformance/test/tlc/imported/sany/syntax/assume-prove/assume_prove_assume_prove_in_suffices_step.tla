(*---
description: Assume/Prove in Suffices Step. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/assume-prove.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE assume_prove_assume_prove_in_suffices_step ----
THEOREM TRUE
<1>a. SUFFICES
  ASSUME CONSTANT x \in S
  PROVE TRUE
<1>b. QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 25 to line 11, col 25 of module assume_prove_assume_prove_in_suffices_step
    | Unknown operator: `S'.
    3002:1 Parsing or semantic analysis failed.
---*)
