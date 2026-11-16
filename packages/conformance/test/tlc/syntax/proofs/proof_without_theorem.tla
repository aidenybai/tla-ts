(*---
description: A proof must follow a theorem.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
outcome: parse-error
---*)
---- MODULE proof_without_theorem ----
BY TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "BY" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file proof_without_theorem
    | In module proof_without_theorem
    | Could not parse module proof_without_theorem from file proof_without_theorem.tla
    | *** Errors: 1
    | In module proof_without_theorem
    | Could not parse module proof_without_theorem from file proof_without_theorem.tla
    3002:1 Parsing or semantic analysis failed.
---*)
