(*---
description: The syntax corpus case "Use & Hide Modules" in use_or_hide.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/use_or_hide.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE use_or_hide_use_hide_modules ----
EXTENDS TestPrelude, M
USE x, MODULE M, 1 + 3
HIDE DEFS MODULE M, -., *, ^+
USE x, MODULE M DEF MODULE M, x
====
---- MODULE TestPrelude ----
-. a == 0
a + b == 1
a * b == 2
a ^+ == 3
x == 4
====
---- MODULE M ----
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./use_or_hide_use_hide_modules.tla", line 12, character 6
    Unexpected ,

    @type: warning
    @msg: File "./use_or_hide_use_hide_modules.tla", line 12, character 6

    Unexpected ,

    File "./use_or_hide_use_hide_modules.tla", line 12, character 6
    Unexpected ,
    File "<unknown>":
    Error: Could not parse "./use_or_hide_use_hide_modules.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
