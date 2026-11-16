(*---
description: "A string whose text is also an identifier later in the module sorts first, because the parser interns identifiers as it reads them and interns stripped strings only during semantic analysis."
ref: "tla2sany/semantic/StringNode.java#StringNode"
flags: [expression]
outcome: success
---*)
---- MODULE strings_identifier_later_sorts_first ----
EXTENDS Integers, TLC
Test == PrintT({"zqb", "zqa"})
Later == LET zqa == 1 IN zqa
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"zqa", "zqb"}'
---*)
