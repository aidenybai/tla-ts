(*---
description: The syntax corpus case "IFF Disambiguation" in infix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/infix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE infix_op_iff_disambiguation ----
EXTENDS TestPrelude
op1 == x <=> y
op2 == f(<=>)
====
---- MODULE TestPrelude ----
VARIABLES x, y
f(a(_, _)) == 0
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./infix_op_iff_disambiguation.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./infix_op_iff_disambiguation.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
