(*---
description: Ported from TLC's Github742Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github742Test.java
features:
  - tlc-regression
outcome: tlc-error
config: |-
  SPECIFICATION
      Spec
  PROPERTY
      Prop
args:
  - -deadlock
---*)
---------------------------- MODULE Github742 ----------------------------
EXTENDS Integers

VARIABLES x

Init ==
	x = FALSE
	
Next ==
	x' \in BOOLEAN
	
Spec ==
	/\ Init
	/\ [][Next]_x 
	/\ \A i \in 1..6: 
			\A j \in 1..6: 
				SF_x(Next) \*  6*6 = 36, which exceeds 32 bits. 
	
Prop ==
	<>[](x \in BOOLEAN)

==========================================================================

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula because it exceeds the maximum supported size in disjunctive normal form.
---*)
