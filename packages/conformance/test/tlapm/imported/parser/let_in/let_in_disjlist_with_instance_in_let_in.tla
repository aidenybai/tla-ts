(*---
description: The syntax corpus case "Disjlist with INSTANCE in LET/IN" in let_in.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/let_in.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE let_in_disjlist_with_instance_in_let_in ----
EXTENDS TestPrelude
op ==
  \/ LET M1 == INSTANCE M2 IN P
  \/ Q
====
---- MODULE M2 ----
====
---- MODULE TestPrelude ----
P == TRUE
Q == TRUE
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./let_in_disjlist_with_instance_in_let_in.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    Unknown module "M2"

    File "./let_in_disjlist_with_instance_in_let_in.tla", line 13, characters 13-26:
    Error: Unknown module "M2"
    File "./let_in_disjlist_with_instance_in_let_in.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
