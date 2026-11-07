(*---
description: The syntax corpus case "Step Expressions with Jlist" in step_expressions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/step_expressions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE step_expressions_step_expressions_with_jlist ----
EXTENDS TestPrelude

op1 == [
  /\ 1
  /\ 2
    ]_x

op2 == <<
  /\ 1
  /\ 2
    >>_x

====

---- MODULE TestPrelude ----
VARIABLE x
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./step_expressions_step_expressions_with_jlist.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./step_expressions_step_expressions_with_jlist.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
