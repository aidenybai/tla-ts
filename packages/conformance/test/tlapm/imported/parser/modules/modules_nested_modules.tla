(*---
description: The syntax corpus case "Nested Modules" in modules.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/modules.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE modules_nested_modules ----
---- MODULE Inner ----
---- MODULE Inner2 ----
---- MODULE Inner3 ----
====
====
====
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0

    @type: obligationsnumber
    @count: 0

    @type: obligationsnumber
    @count: 0

    @type: obligationsnumber
    @count: 0
---*)
