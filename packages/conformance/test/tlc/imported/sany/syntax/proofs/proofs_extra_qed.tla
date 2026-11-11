(*---
description: Extra QED. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/proofs.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE proofs_extra_qed ----
THEOREM x == TRUE
<1> P
  <+> Q
  <*> QED
  <*> QED
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "<1>" at line 14, column 1 and token "QED" 
    | Residual stack trace follows:
    | Module definition starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file proofs_extra_qed
    | In module proofs_extra_qed
    | Could not parse module proofs_extra_qed from file proofs_extra_qed.tla
    | *** Errors: 1
    | In module proofs_extra_qed
    | Could not parse module proofs_extra_qed from file proofs_extra_qed.tla
    3002:1 Parsing or semantic analysis failed.
---*)
