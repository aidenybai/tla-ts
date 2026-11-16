(*---
description: The syntax corpus case "Step Expression No Stuttering" in step_expressions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/step_expressions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE step_expressions_step_expression_no_stuttering ----
EXTENDS TestPrelude
op == <<A>>_<<x, y, z>>
====
---- MODULE TestPrelude ----
VARIABLES A, x, y, z
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./step_expressions_step_expression_no_stuttering.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./step_expressions_step_expression_no_stuttering.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
