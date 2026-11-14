(*---
description: The syntax corpus case "Prefix Operator Application" in prefix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/prefix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE prefix_op_prefix_operator_application ----
EXTENDS TestPrelude
op1 == {
  ~x,
  \lnot x,
  \neg x,
  UNION x,
  SUBSET x,
  DOMAIN x,
  -x,
  ENABLED x,
  UNCHANGED x
}
op2 == []x
op3 == <>x
====
---- MODULE TestPrelude ----
VARIABLE x
-. y == y
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./prefix_op_prefix_operator_application.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./prefix_op_prefix_operator_application.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
