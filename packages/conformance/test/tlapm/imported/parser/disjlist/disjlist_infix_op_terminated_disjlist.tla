(*---
description: The syntax corpus case "Infix Op Terminated Disjlist" in disjlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/disjlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE disjlist_infix_op_terminated_disjlist ----
EXTENDS TestPrelude
op ==
 \/ 1
 + 2 
 \/ 3
====
---- MODULE TestPrelude ----
CONSTANT _ + _
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./disjlist_infix_op_terminated_disjlist.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./disjlist_infix_op_terminated_disjlist.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
