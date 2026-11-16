(*---
description: Label With Parameters. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/labels.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE labels_label_with_parameters ----
op == \A a, b \in Nat : lbl(a, b) :: P(a, b)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 19 to line 9, col 21 of module labels_label_with_parameters
    | Unknown operator: `Nat'.
    | line 9, col 38 to line 9, col 38 of module labels_label_with_parameters
    | Unknown operator: `P'.
    3002:1 Parsing or semantic analysis failed.
---*)
