(*---
description: The syntax corpus case "Postfix Operators as Parameters" in postfix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/postfix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE postfix_op_postfix_operators_as_parameters ----
EXTENDS TestPrelude
op == f(
  ^+,
  ^*,
  ^#,
  '
)
====
---- MODULE TestPrelude ----
CONSTANTS _^+, _^*, _^#
f(a(_), b(_), c(_), d(_)) == 0
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./postfix_op_postfix_operators_as_parameters.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./postfix_op_postfix_operators_as_parameters.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
