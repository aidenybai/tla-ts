(*---
description: The syntax corpus case "Multiple nested record updates with dot syntax" in except.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/except.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE except_multiple_nested_record_updates_with_dot_syntax ----
EXTENDS TestPrelude
r == [a EXCEPT !.a.b.c = @, !.b.x = 5]
====
---- MODULE TestPrelude ----
VARIABLE a
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./except_multiple_nested_record_updates_with_dot_syntax.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./except_multiple_nested_record_updates_with_dot_syntax.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
