(*---
description: The syntax corpus case "Nonfix Prefix Operators" in prefix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/prefix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE prefix_op_nonfix_prefix_operators ----
EXTENDS TestPrelude
op == {
  A!B!-.(x)
}
====
---- MODULE TestPrelude ----
A == INSTANCE M1
VARIABLE x
====
---- MODULE M1 ----
B == INSTANCE M2
====
---- MODULE M2 ----
-. x == x
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./prefix_op_nonfix_prefix_operators.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./prefix_op_nonfix_prefix_operators.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
