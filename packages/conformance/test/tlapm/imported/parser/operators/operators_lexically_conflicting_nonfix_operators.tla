(*---
description: The syntax corpus case "Lexically-Conflicting Nonfix Operators" in operators.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/operators.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE operators_lexically_conflicting_nonfix_operators ----
EXTENDS TestPrelude
conflicts_with_octal == \o (1,2)
====
---- MODULE TestPrelude ----
x \o y == 0
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./operators_lexically_conflicting_nonfix_operators.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./operators_lexically_conflicting_nonfix_operators.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
