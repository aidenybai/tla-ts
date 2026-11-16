(*---
description: PROOF must follow a theorem.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
outcome: parse-error
---*)
---- MODULE proof_keyword_without_theorem ----
PROOF OBVIOUS
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "PROOF" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file proof_keyword_without_theorem
    | In module proof_keyword_without_theorem
    | Could not parse module proof_keyword_without_theorem from file proof_keyword_without_theorem.tla
    | *** Errors: 1
    | In module proof_keyword_without_theorem
    | Could not parse module proof_keyword_without_theorem from file proof_keyword_without_theorem.tla
    3002:1 Parsing or semantic analysis failed.
---*)
