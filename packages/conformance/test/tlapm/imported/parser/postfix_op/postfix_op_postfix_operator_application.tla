(*---
description: The syntax corpus case "Postfix Operator Application" in postfix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/postfix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE postfix_op_postfix_operator_application ----
EXTENDS TestPrelude
op == {
  x^+,
  x^*,
  x^#,
  x'
}
====
---- MODULE TestPrelude ----
VARIABLE x
CONSTANTS _^+, _^*, _^#
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./postfix_op_postfix_operator_application.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./postfix_op_postfix_operator_application.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
