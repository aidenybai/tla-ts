(*---
description: Label interfering with precedence. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/labels.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE labels_label_interfering_with_precedence ----
op == a * lab :: b + c
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Removing label at line 9, col 11 to line 9, col 13 of module labels_label_interfering_with_precedence would change expression parsing.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 11.
    | ExtendableExpr starting at line 9, column 7.
    | Expression starting at line 9, column 7.
    | Definition starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file labels_label_interfering_with_precedence
    | In module labels_label_interfering_with_precedence
    | Could not parse module labels_label_interfering_with_precedence from file labels_label_interfering_with_precedence.tla
    | *** Errors: 1
    | In module labels_label_interfering_with_precedence
    | Could not parse module labels_label_interfering_with_precedence from file labels_label_interfering_with_precedence.tla
    3002:1 Parsing or semantic analysis failed.
---*)
