(*---
description: Evaluates a random int expression, seed 262, number 5162.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05162 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b8012 \in (Head(<<1, 2>>) .. (7 + 0)) : ((CHOOSE b8013 \in {2, 1, 3} : FALSE) \in (b8012 .. <<3, 1, 2>>))) * (-CASE ({1, 2} \subseteq {1}) -> (0 \div -1) [] OTHER -> LET b8014 == 3 IN 2)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 170 to line 14, col 173 of module random_05162 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 168.
    | Expression starting at line 14, column 168.
    | ExtendableExpr starting at line 14, column 167.
    | Expression starting at line 14, column 167.
    | Case Arm starting at line 14, column 141.
    | Fatal errors while parsing TLA+ spec in file random_05162
    | In module random_05162
    | Could not parse module random_05162 from file random_05162.tla
    | *** Errors: 1
    | In module random_05162
    | Could not parse module random_05162 from file random_05162.tla
    3002:1 Parsing or semantic analysis failed.
---*)
