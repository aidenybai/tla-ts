(*---
description: The syntax corpus case "Keyword-Unit-Terminated Conjlist" in conjlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/conjlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE conjlist_keyword_unit_terminated_conjlist ----
EXTENDS TestPrelude

op1 ==
  /\ 1
  /\ 2
      ASSUME A

op2 ==
  /\ 3
  /\ 4
      LOCAL INSTANCE ModuleName

op3 ==
  /\ 5
  /\ 6
      -----------------

op4 ==
  /\ 7
  /\ 8
      ---- MODULE Nested ----
      ====

op5 ==
  /\ 9
  /\ 10
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
    @msg: File "./conjlist_keyword_unit_terminated_conjlist.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    Unknown module "ModuleName"

    File "./conjlist_keyword_unit_terminated_conjlist.tla", line 21, characters 13-31:
    Error: Unknown module "ModuleName"
    File "./conjlist_keyword_unit_terminated_conjlist.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
