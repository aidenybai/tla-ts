(*---
description: Label not interfering with precedence. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/labels.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE labels_label_not_interfering_with_precedence ----
op == a + lab :: b * c
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 9 to line 9, col 9 of module labels_label_not_interfering_with_precedence
    | Could not find declaration or definition of symbol '+'.
    | line 9, col 7 to line 9, col 22 of module labels_label_not_interfering_with_precedence
    | Couldn't resolve infix operator symbol `+'.
    3002:1 Parsing or semantic analysis failed.
---*)
