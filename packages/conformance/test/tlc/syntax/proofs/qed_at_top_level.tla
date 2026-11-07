(*---
description: QED cannot appear outside a proof.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
outcome: parse-error
---*)
---- MODULE qed_at_top_level ----
QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "QED" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file qed_at_top_level
    | In module qed_at_top_level
    | Could not parse module qed_at_top_level from file qed_at_top_level.tla
    | *** Errors: 1
    | In module qed_at_top_level
    | Could not parse module qed_at_top_level from file qed_at_top_level.tla
    3002:1 Parsing or semantic analysis failed.
---*)
