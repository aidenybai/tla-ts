(*---
description: Evaluates a random set expression, seed 262, number 887.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00887 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b1434 == ([x \in Nat |-> x + 1])[2] IN (-1) % (DOMAIN [x \in Nat |-> x + 1] \div Len(<<1, 2>>))) .. (([b1435 \in 2..1 |-> -1])[CASE TRUE -> 2147483647 [] OTHER -> FALSE] + Head((<<1, 2>> \o <<1, 2>>)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 69 to line 14, col 74 of module random_00887 and \div.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 76.
    | Expression starting at line 14, column 69.
    | ExtendableExpr starting at line 14, column 68.
    | ExtendableExpr starting at line 14, column 61.
    | Expression starting at line 14, column 61.
    | Fatal errors while parsing TLA+ spec in file random_00887
    | In module random_00887
    | Could not parse module random_00887 from file random_00887.tla
    | *** Errors: 1
    | In module random_00887
    | Could not parse module random_00887 from file random_00887.tla
    3002:1 Parsing or semantic analysis failed.
---*)
