(*---
description: Nested Assume/Prove With Label. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/assume-prove.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE assume_prove_nested_assume_prove_with_label ----
THEOREM thm ==
  ASSUME asm :: 
    ASSUME P
    PROVE Q
  PROVE C
OMITTED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 11, col 12 to line 11, col 12 of module assume_prove_nested_assume_prove_with_label
    | Unknown operator: `P'.
    | line 12, col 11 to line 12, col 11 of module assume_prove_nested_assume_prove_with_label
    | Unknown operator: `Q'.
    | line 13, col 9 to line 13, col 9 of module assume_prove_nested_assume_prove_with_label
    | Unknown operator: `C'.
    3002:1 Parsing or semantic analysis failed.
---*)
