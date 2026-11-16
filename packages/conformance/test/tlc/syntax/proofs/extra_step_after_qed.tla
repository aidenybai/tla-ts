(*---
description: No step may follow QED at the same level.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
outcome: parse-error
---*)
---- MODULE extra_step_after_qed ----
THEOREM TRUE
<1> QED
<1>1. TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "<1>1." at line 10, column 1 and token "QED" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file extra_step_after_qed
    | In module extra_step_after_qed
    | Could not parse module extra_step_after_qed from file extra_step_after_qed.tla
    | *** Errors: 1
    | In module extra_step_after_qed
    | Could not parse module extra_step_after_qed from file extra_step_after_qed.tla
    3002:1 Parsing or semantic analysis failed.
---*)
