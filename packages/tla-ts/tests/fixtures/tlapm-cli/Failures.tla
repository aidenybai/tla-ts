---- MODULE Failures ----
EXTENDS Naturals, TLAPS
CONSTANTS Alpha, Beta, Gamma
ASSUME AlphaType == Alpha \in Nat /\ Alpha > 1
ASSUME BetaType == Beta \in Nat /\ Beta > Alpha
THEOREM Sum == Alpha + Beta > 2
  BY AlphaType, BetaType
THEOREM Wrong == 1 + 1 = 2
  BY Zenon
THEOREM Long == Alpha + Beta + Gamma + Alpha * Beta * Gamma + Alpha * Alpha * Beta = Gamma * Gamma * Gamma + Beta * Beta
  BY AlphaType, BetaType, Zenon
THEOREM Fine == TRUE
  BY Isa
====
