(*---
description: TAKE cannot appear outside a proof.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
outcome: parse-error
---*)
---- MODULE take_at_top_level ----
TAKE x \in {1}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "TAKE" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file take_at_top_level
    | In module take_at_top_level
    | Could not parse module take_at_top_level from file take_at_top_level.tla
    | *** Errors: 1
    | In module take_at_top_level
    | Could not parse module take_at_top_level from file take_at_top_level.tla
    3002:1 Parsing or semantic analysis failed.
---*)
