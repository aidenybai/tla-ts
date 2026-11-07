(*---
description: The syntax corpus case "Infix Op Terminated Conjlist" in conjlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/conjlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE conjlist_infix_op_terminated_conjlist ----
EXTENDS TestPrelude
op ==
 /\ 1
 + 2 
 /\ 3
====
---- MODULE TestPrelude ----
CONSTANT _ + _
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./conjlist_infix_op_terminated_conjlist.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./conjlist_infix_op_terminated_conjlist.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
