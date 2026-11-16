(*---
description: Evaluates a random set expression, seed 262, number 7997.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07997 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b12344 \in ((([a |-> 1]).a \div (2147483647 % 2147483647)) .. ((2 % [a |-> 1, b |-> TRUE]) % ([a |-> 1]).a)) : ((IF TRUE THEN FALSE ELSE b12344 .. (1 \div -1)) \subseteq Append((<<3, 1, 2>> \o <<>>), (0 - b12344)))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 167 to line 14, col 170 of module random_07997 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 165.
    | Expression starting at line 14, column 165.
    | ExtendableExpr starting at line 14, column 164.
    | ExtendableExpr starting at line 14, column 154.
    | Expression starting at line 14, column 154.
    | Fatal errors while parsing TLA+ spec in file random_07997
    | In module random_07997
    | Could not parse module random_07997 from file random_07997.tla
    | *** Errors: 1
    | In module random_07997
    | Could not parse module random_07997 from file random_07997.tla
    3002:1 Parsing or semantic analysis failed.
---*)
