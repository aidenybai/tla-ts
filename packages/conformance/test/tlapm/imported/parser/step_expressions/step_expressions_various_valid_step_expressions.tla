(*---
description: The syntax corpus case "Various Valid Step Expressions" in step_expressions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/step_expressions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE step_expressions_various_valid_step_expressions ----
EXTENDS TestPrelude
Prop1 == [][x = {1, 2}]_x
Prop2 == [][1 \in {1, 2}]_x
Prop3 == [][LET S == {1, 2} IN x \in S]_x
Prop4 == [][LET S == {1, 2} IN x \in {1, 2}]_x
Prop5 == [][TRUE /\ x \in {1, 2}]_x
====
---- MODULE TestPrelude ----
VARIABLE x
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./step_expressions_various_valid_step_expressions.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./step_expressions_various_valid_step_expressions.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
