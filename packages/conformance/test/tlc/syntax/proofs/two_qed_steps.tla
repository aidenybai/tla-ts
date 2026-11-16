(*---
description: A second QED step at one level is rejected.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [proofs]
outcome: parse-error
---*)
---- MODULE two_qed_steps ----
THEOREM TRUE
<1> QED
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "<1>" at line 10, column 1 and token "QED" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file two_qed_steps
    | In module two_qed_steps
    | Could not parse module two_qed_steps from file two_qed_steps.tla
    | *** Errors: 1
    | In module two_qed_steps
    | Could not parse module two_qed_steps from file two_qed_steps.tla
    3002:1 Parsing or semantic analysis failed.
---*)
