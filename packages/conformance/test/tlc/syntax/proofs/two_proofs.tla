(*---
description: A theorem has one proof.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
outcome: parse-error
---*)
---- MODULE two_proofs ----
THEOREM TRUE OBVIOUS OBVIOUS
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "OBVIOUS" at line 8, column 22 and token "OBVIOUS" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file two_proofs
    | In module two_proofs
    | Could not parse module two_proofs from file two_proofs.tla
    | *** Errors: 1
    | In module two_proofs
    | Could not parse module two_proofs from file two_proofs.tla
    3002:1 Parsing or semantic analysis failed.
---*)
