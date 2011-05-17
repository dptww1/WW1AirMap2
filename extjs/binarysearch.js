/*
  This work is licensed under Creative Commons GNU GPL License
  http://creativecommons.org/licenses/GPL/2.0/
  Copyright (C) 2006 Russel Lindsay
  www.weetbixthecat.com
*/
 
 
/**
  Binary search
  1. Array MUST be sorted already
  2. If the array has multiple elements with the same value the first instance
     in the array is returned e.g.
       [1,2,3,3,3,4,5].binarySearch(3);  // returns 2
     This means slightly more loops than other binary searches, but I figure
     it's worth it, as the worst case searchs on a 1 million array is around 20
  3. The return value is the index of the first matching element, OR
     if not found, a negative index of where the element should be - 1 e.g.
       [1,2,3,6,7].binarySearch(5);      // returns -4
       [1,2,3,6,7].binarySearch(0);      // returns -1
     To insert at this point do something like this:
       var array = [1,2,3,6,7];
       var index = array.binarySearch(5);
       if(index < 0)
         array.splice(Math.abs(index)-1, 0, 5); // inserted the number 5
  4. mid calculation from
     http://googleresearch.blogspot.com/2006/06/extra-extra-read-all-about-it-nearly.html
*/
Array.prototype.binarySearch = function(item)
{
  var left = -1,
      right = this.length,
      mid;

  while(right - left > 1)
  {
    mid = (left + right) >>> 1;
    if(this[mid] < item)
      left = mid;
    else
      right = mid;
  }

  if(this[right] != item)
    return -(right + 1);

  return right;
}
