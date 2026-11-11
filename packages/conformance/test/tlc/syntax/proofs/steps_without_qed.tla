(*---
description: A stepped proof needs a QED step.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
outcome: parse-error
---*)
---- MODULE steps_without_qed ----
THEOREM TRUE
<1>1. TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Step number"
    | Encountered "====" at line 10, column 1 and token "TRUE" 
    | Residual stack trace follows:
    | Step starting at line 10, column 1.
    | Proof starting at line 9, column 1.
    | Theorem starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file steps_without_qed
    | In module steps_without_qed
    | Could not parse module steps_without_qed from file steps_without_qed.tla
    | *** Errors: 1
    | In module steps_without_qed
    | Could not parse module steps_without_qed from file steps_without_qed.tla
    3002:1 Parsing or semantic analysis failed.
---*)
