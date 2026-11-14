(*---
description: The syntax corpus case "Infix Operator Definition" in infix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/infix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE infix_op_infix_operator_definition ----

x & y == 0
x && y == 1
x \approx y == 2
x := y == 3
x \asymp y == 4
x \bigcirc y == 5
x ::= y == 6
x \bullet y == 7
x \circ y == 12
x @@ y == 13
x \cong y == 14
x \div y == 17
x $ y == 18
x $$ y == 19
x \doteq y == 20
x .. y == 21
x ... y == 22
x !! y == 25
x >= y == 26
x \gg y == 28
x > y == 29
x ## y == 30
x =| y == 36
x <= y == 38
x \ll y == 41
x -| y == 44
x < y == 45
x <: y == 46
x :> y == 47
x - y == 48
x -- y == 49
x % y == 50
x %% y == 51
x * y == 52
x ** y == 53
x (.) y == 57
x (-) y == 59
x (+) y == 61
x (/) y == 63
x (\X) y == 65
x + y == 67
x ++ y == 69
x ^ y == 70
x ^^ y == 71
x \prec y == 72
x \preceq y == 73
x \propto y == 74
x ?? y == 75
x |= y == 76
x |- y == 77
x \sim y == 79
x \simeq y == 80
x / y == 81
x // y == 82
x \sqcap y == 83
x \sqcup y == 84
x \sqsubset y == 85
x \sqsubseteq y == 86
x \sqsupset y == 87
x \sqsupseteq y == 88
x \star y == 89
x \subset y == 90
x \succ y == 92
x \succeq y == 93
x \supset y == 94
x \supseteq y == 95
x \uplus y == 98
x | y == 99
x || y == 100
x \wr y == 101

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
