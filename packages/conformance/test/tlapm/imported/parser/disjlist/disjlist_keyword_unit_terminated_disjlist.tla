(*---
description: The syntax corpus case "Keyword-Unit-Terminated Disjlist" in disjlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/disjlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE disjlist_keyword_unit_terminated_disjlist ----
EXTENDS TestPrelude

op1 ==
  \/ 1
  \/ 2
      ASSUME A

op2 ==
  \/ 3
  \/ 4
      LOCAL INSTANCE ModuleName

op3 ==
  \/ 5
  \/ 6
      -----------------

op4 ==
  \/ 7
  \/ 8
      ---- MODULE Nested ----
      ====

op5 ==
  \/ 9
  \/ 10
      VARIABLES x, y
====
---- MODULE TestPrelude ----
A == TRUE
====
---- MODULE ModuleName ----
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./disjlist_keyword_unit_terminated_disjlist.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    Unknown module "ModuleName"

    File "./disjlist_keyword_unit_terminated_disjlist.tla", line 21, characters 13-31:
    Error: Unknown module "ModuleName"
    File "./disjlist_keyword_unit_terminated_disjlist.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
