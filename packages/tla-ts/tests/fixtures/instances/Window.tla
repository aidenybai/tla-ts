------------------------------- MODULE Window -------------------------------
EXTENDS Naturals

CONSTANT Width

VARIABLE position

InWindow == position < Width

Advance == position' = (position + 1) % (2 * Width)
=============================================================================
